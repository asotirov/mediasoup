#define MS_CLASS "RTC::SenderBandwidthEstimator"
// #define MS_LOG_DEV // TODO

#include "RTC/SenderBandwidthEstimator.hpp"
#include "DepLibUV.hpp"
#include "Logger.hpp"
#include <limits>

namespace RTC
{
	/* Static. */

	static constexpr uint64_t AvailableBitrateEventInterval{ 2000u }; // In ms.
	static constexpr uint16_t MaxSentInfoAge{ 2000u };                // TODO: Let's see.
	static constexpr float DefaultRtt{ 100 };

	/* Instance methods. */

	SenderBandwidthEstimator::SenderBandwidthEstimator(
	  RTC::SenderBandwidthEstimator::Listener* listener, uint32_t initialAvailableBitrate)
	  : listener(listener), initialAvailableBitrate(initialAvailableBitrate), rtt(DefaultRtt),
	    sendTransmission(1000u), sendTransmissionTrend(0.15f)
	{
		MS_TRACE();
	}

	SenderBandwidthEstimator::~SenderBandwidthEstimator()
	{
		MS_TRACE();
	}

	void SenderBandwidthEstimator::TransportConnected()
	{
		MS_TRACE();

		this->availableBitrate              = this->initialAvailableBitrate;
		this->lastAvailableBitrateEventAtMs = DepLibUV::GetTimeMs();
	}

	void SenderBandwidthEstimator::TransportDisconnected()
	{
		MS_TRACE();

		this->availableBitrate = 0u;

		this->sentInfos.clear();
		this->cummulativeResult.Reset();
	}

	void SenderBandwidthEstimator::RtpPacketSent(SentInfo& sentInfo)
	{
		MS_TRACE();

		auto nowMs = sentInfo.sentAtMs;

		// Remove old sent infos.
		auto it = this->sentInfos.lower_bound(sentInfo.wideSeq - MaxSentInfoAge + 1);

		this->sentInfos.erase(this->sentInfos.begin(), it);

		// Insert the sent info into the map.
		this->sentInfos[sentInfo.wideSeq] = sentInfo;

		// Fill the send transmission counter.
		this->sendTransmission.Update(sentInfo.size, nowMs);

		// Update the send transmission trend.
		auto sendBitrate = this->sendTransmission.GetRate(nowMs);

		this->sendTransmissionTrend.Update(sendBitrate, nowMs);

		// TODO: Remove.
		// MS_DEBUG_DEV(
		// 	"[wideSeq:%" PRIu16 ", size:%zu, isProbation:%s, bitrate:%" PRIu32 "]",
		// 	sentInfo.wideSeq,
		// 	sentInfo.size,
		// 	sentInfo.isProbation ? "true" : "false",
		// 	sendBitrate);
	}

	void SenderBandwidthEstimator::ReceiveRtcpTransportFeedback(
	  const RTC::RTCP::FeedbackRtpTransportPacket* feedback)
	{
		MS_TRACE();

		// TODO Remove.
		// feedback->Dump();

		auto nowMs         = DepLibUV::GetTimeMs();
		uint64_t elapsedMs = nowMs - this->cummulativeResult.GetStartedAtMs();

		// Drop ongoing cummulative result if too old.
		if (elapsedMs > 5000u)
			this->cummulativeResult.Reset();

		for (auto& result : feedback->GetPacketResults())
		{
			if (!result.received)
				continue;

			uint16_t wideSeq = result.sequenceNumber;
			auto it          = this->sentInfos.find(wideSeq);

			if (it == this->sentInfos.end())
			{
				MS_WARN_DEV("received packet not present in sent infos [wideSeq:%" PRIu16 "]", wideSeq);

				continue;
			}

			auto& sentInfo = it->second;

			this->cummulativeResult.AddPacket(
			  sentInfo.size,
			  static_cast<int64_t>(sentInfo.sentAtMs),
			  static_cast<int64_t>(result.receivedAtMs));
		}

		// Do nothing else if too early.
		if (elapsedMs < 100u || this->cummulativeResult.GetNumPackets() < 20u)
			return;

		auto sendBitrate      = this->sendTransmission.GetRate(nowMs);
		auto sendBitrateTrend = this->sendTransmissionTrend.GetValue();

		// TODO: Remove.
		MS_DEBUG_DEV(
		  "[numPackets:%zu, totalSize:%zu] "
		  "[send bps:%" PRIu32 ", recv bps:%" PRIu32
		  "] "
		  "[real bps:%" PRIu32 ", trend bps:%" PRIu32 "]",
		  this->cummulativeResult.GetNumPackets(),
		  this->cummulativeResult.GetTotalSize(),
		  this->cummulativeResult.GetSendBitrate(),
		  this->cummulativeResult.GetReceiveBitrate(),
		  sendBitrate,
		  sendBitrateTrend);

		// Reset cummulative result.
		this->cummulativeResult.Reset();
	}

	void SenderBandwidthEstimator::UpdateRtt(float rtt)
	{
		MS_TRACE();

		this->rtt = rtt;
	}

	uint32_t SenderBandwidthEstimator::GetAvailableBitrate() const
	{
		MS_TRACE();

		return this->availableBitrate;
	}

	void SenderBandwidthEstimator::RescheduleNextAvailableBitrateEvent()
	{
		MS_TRACE();

		this->lastAvailableBitrateEventAtMs = DepLibUV::GetTimeMs();
	}

	void SenderBandwidthEstimator::CummulativeResult::AddPacket(
	  size_t size, int64_t sentAtMs, int64_t receivedAtMs)
	{
		MS_TRACE();

		if (this->numPackets == 0u)
		{
			this->firstPacketSentAtMs     = sentAtMs;
			this->firstPacketReceivedAtMs = receivedAtMs;
			this->lastPacketSentAtMs      = sentAtMs;
			this->lastPacketReceivedAtMs  = receivedAtMs;
		}
		else
		{
			if (sentAtMs < this->firstPacketSentAtMs)
				this->firstPacketSentAtMs = sentAtMs;

			if (receivedAtMs < this->firstPacketReceivedAtMs)
				this->firstPacketReceivedAtMs = receivedAtMs;

			if (sentAtMs > this->lastPacketSentAtMs)
				this->lastPacketSentAtMs = sentAtMs;

			if (receivedAtMs > this->lastPacketReceivedAtMs)
				this->lastPacketReceivedAtMs = receivedAtMs;
		}

		this->numPackets++;
		this->totalSize += size;
	}

	void SenderBandwidthEstimator::CummulativeResult::Reset()
	{
		MS_TRACE();

		this->numPackets              = 0u;
		this->totalSize               = 0u;
		this->firstPacketSentAtMs     = 0u;
		this->lastPacketSentAtMs      = 0u;
		this->firstPacketReceivedAtMs = 0u;
		this->lastPacketReceivedAtMs  = 0u;
	}
} // namespace RTC
